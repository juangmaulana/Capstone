import { Client } from "@gradio/client";

async function run() {
  const response = await fetch("https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png");
  const exampleImage = await response.blob();
  
  const client = await Client.connect("http://194.233.74.133:7860");
  const result = await client.predict("/predict", {
    image: exampleImage,
  });
  console.log(JSON.stringify(result.data, null, 2));
}

run().catch(console.error);
