import axios from "axios";
import { FarmNodeTypes, FarmNodeUploadTypes } from "@/app/(types)/NodeDataType";

export async function getAllFarmNodes() {
  try {
    const res = await axios.get(
      `${process.env.EXPO_PUBLIC_SERVER}/api/node/getAllNodes`,
    );

    return res.data.data;
  } catch (error: any) {
    console.log("Error: ", error.message);
    return;
  }
}

export async function addNewNode(formData: FarmNodeUploadTypes) {
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
