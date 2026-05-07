import gradio as gr
from ultralytics import YOLO

# Load model best.pt
model = YOLO('best.pt')

def predict(image):
    if image is None:
        return None, None
        
    results = model(image)

    res_image = results[0].plot()
    res_image_rgb = res_image[..., ::-1]

    boxes_data = []
    for box in results[0].boxes:
        xyxy = box.xyxy[0].tolist() 
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        cls_name = model.names[cls_id]

        boxes_data.append({
            "spesies": cls_name,
            "akurasi": round(conf, 5),
            "bounding_box": [round(x, 1) for x in xyxy]
        })

    return res_image_rgb, boxes_data

with gr.Blocks(theme=gr.themes.Soft()) as app:
    
    gr.Markdown(
        """rem
        <center>
        <h1>🌱 Deteksi Spesies Tanaman Invasif</h1>
        <p>Aplikasi ini menggunakan model AI YOLO untuk mendeteksi 5 jenis tanaman: <b>Vachellia nilotica, Ageratum conyzoides, Lantana camara, Clitoria ternatea, dan Merremia hederacea</b>.</p>
        </center>
        """
    )
    
    with gr.Row():
        with gr.Column():
            image_input = gr.Image(type="pil", label="1. Upload Gambar Tanaman")
            submit_btn = gr.Button("🔍 Deteksi Gambar", variant="primary")
        
        with gr.Column():
            image_output = gr.Image(type="numpy", label="2. Hasil Deteksi")
            json_output = gr.JSON(label="3. Bounding Box", visible=False)
            
    gr.Markdown("### Atau, coba dengan gambar contoh berikut:")
    
    gr.Examples(
        examples=[
            ["vachellia_nilotica.jpeg"],
            ["ageratum_conyzoides.jpeg"],
            ["lantana_camara.jpeg"],
            ["clitoria_ternatea.jpeg"],
            ["merremia_hederacea.jpeg"]
        ],
        inputs=image_input,
        outputs=[image_output, json_output],
        fn=predict,
        cache_examples=False
    )

    submit_btn.click(fn=predict, inputs=image_input, outputs=[image_output, json_output])

# Jalankan aplikasi
if __name__ == "__main__":
    app.launch(server_name="0.0.0.0", server_port=7860)