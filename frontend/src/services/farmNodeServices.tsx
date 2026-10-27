import axios from "axios";

interface FarmNodeTypes {
  node_name: string;
  min_temperature: string;
  min_humidity: string;
  min_pH: string;
  min_tds: string;
  max_temperature: string;
  max_humidity: string;
  max_pH: string;
  max_tds: string;
}

export async function getAllFarmNodes() {
  try {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_SERVER}/api/node/getAllNodes`,
    );

    return response.data.data;
  } catch (error: any) {
    console.log("Error: ", error.message);
    return;
  }
}

export async function addNewNode(formData: FarmNodeTypes) {
  try {
    const res = await axios.post(
      `${process.env.EXPO_PUBLIC_SERVER}/api/node/addNewNode`,
      formData,
    );

    return { status: res.status, node_id: String(res.data.node_id) };
  } catch (error: any) {
    console.log("Error: ", error.message);
    return;
  }
}

export async function updateNode(formData: any) {
  try {
    const res = await axios.post(
      `${process.env.EXPO_PUBLIC_SERVER}/api/node/updateNode`,
      formData,
    );

    return res.status;
  } catch (error: any) {
    console.log("Error: ", error.message);
    return;
  }
}

export async function deleteNode(node_id: String) {
  try {
    const res = await axios.post(
      `${process.env.EXPO_PUBLIC_SERVER}/api/node/deleteNode`,
      { node_id },
    );

    return res.status;
  } catch (error: any) {
    console.log("Error: ", error.message);
    return;
  }
}
