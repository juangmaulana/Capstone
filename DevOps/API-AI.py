from gradio_client import Client, handle_file

client = Client("Xyzra/first-model-CAPS12")
result = client.predict(
	image=handle_file('path/to/file_images'), # ganti sama gambar yang pengen di test
	api_name="/predict",
)
print(result)

# Jangan lupa install gradio-client
# $ pip install gradio_client