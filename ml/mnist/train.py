import tensorflow as tf
import tensorflowjs as tfjs
import os
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--epochs', type=int, default=30)
parser.add_argument('--out', type=str, default=None)
args = parser.parse_args()

(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
x_train = x_train.reshape(-1, 28, 28, 1).astype('float32') / 255.0
x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0

# Augmentation lives in the data pipeline (NOT in the model), so tfjs can load it.
# Baseline uses light augmentation only. Stronger/combined aug was tested on
# 2026-09-27 and found to LOWER val accuracy (over-regularization); see README sec 7.
augmenter = tf.keras.Sequential([
    tf.keras.layers.RandomRotation(0.12),
    tf.keras.layers.RandomTranslation(0.12, 0.12),
    tf.keras.layers.RandomZoom(0.12),
])

BATCH = 128
train_ds = (tf.data.Dataset.from_tensor_slices((x_train, y_train))
            .shuffle(10000).batch(BATCH)
            .map(lambda x, y: (augmenter(x, training=True), y))
            .prefetch(tf.data.AUTOTUNE))
val_ds = tf.data.Dataset.from_tensor_slices((x_test, y_test)).batch(BATCH)

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(28, 28, 1)),
    tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.MaxPooling2D((2, 2)),
    tf.keras.layers.Dropout(0.25),
    tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.MaxPooling2D((2, 2)),
    tf.keras.layers.Dropout(0.25),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.5),
    tf.keras.layers.Dense(10, activation='softmax')
])
model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
              loss='sparse_categorical_crossentropy', metrics=['accuracy'])

es = tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=4, restore_best_weights=True)
rlr = tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2)
model.fit(train_ds, epochs=args.epochs, validation_data=val_ds, callbacks=[es, rlr])
loss, acc = model.evaluate(x_test, y_test)
print(f'Test accuracy: {acc:.4f}')

out = args.out or os.path.join(os.path.dirname(__file__), '..', '..', 'apps', 'web', 'public', 'models', 'mnist')
out = os.path.abspath(out)
os.makedirs(out, exist_ok=True)
tfjs.converters.save_keras_model(model, out)
# Keras 3 export emits 'batch_shape' and 'sequential_N/' weight prefixes that tfjs rejects; fix in place.
from fix_model import fix as fix_export
fix_export(out)
print(f'Saved (and fixed for tfjs) to {out}')
