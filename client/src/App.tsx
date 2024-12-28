import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8080";

function App() {
  const [data, setData] = useState<string>("");
  const [secretKey, setSecretKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    generateKey();
    getData();
  }, []);

  const generateKey = async () => {
    const key = await window.crypto.subtle.generateKey(
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
    setSecretKey(key);
    updateData(key);
  };

  const getData = async () => {
    const response = await fetch(API_URL);
    const { data } = await response.json();
    setData(data);
  };

  const saveBackup = (data: string, signature: string) => {
    if (data) {
      localStorage.setItem("backupData", data);
    }
    localStorage.setItem("backupSignature", signature);
  };

  const updateData = async (secretKeyParameter: CryptoKey | null) => {
    if (!secretKey && !secretKeyParameter) {
      alert("Key not initialized!");
      return;
    }

    const encoder = new TextEncoder();
    const signature = await window.crypto.subtle.sign(
      "HMAC",
      secretKey! || secretKeyParameter,
      encoder.encode(data)
    );


    const signatureHex = Array.from(new Uint8Array(signature))
      ?.map((byte) => byte.toString(16).padStart(2, "0"))
      ?.join("");

    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        data,
        signature: signatureHex,
      }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    saveBackup(data, signatureHex);

    await getData();
  };

  const verifyData = async () => {
    if (!secretKey) {
      alert("Key not initialized!");
      return;
    }

    const response = await fetch(API_URL);
    const { data, signature } = await response.json();


    const encoder = new TextEncoder();
    const isValid = await window.crypto.subtle.verify(
      "HMAC",
      secretKey,
      new Uint8Array(signature.match(/.{1,2}/g)!?.map((byte) => parseInt(byte, 16))),
      encoder.encode(data)
    );

    const dataFromStorage = localStorage.getItem("backupData");

    if (isValid || !dataFromStorage) {
      alert("Data is valid.");
    } else {
      alert("Data has been tampered with! Restoring backup...");
      recoverBackup();
    }
  };

  const recoverBackup = () => {
    const backupData = localStorage.getItem("backupData");
    const backupSignature = localStorage.getItem("backupSignature");

    if (!backupData || !backupSignature) {
      return;
    }

    alert("Backup restored from storage.");
    setData(backupData);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        position: "absolute",
        padding: 0,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "20px",
        fontSize: "30px",
      }}
    >
      <div>Saved Data</div>
      <input
        style={{ fontSize: "30px" }}
        type="text"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <button style={{ fontSize: "20px" }} onClick={() => updateData(null)}>
          Update Data
        </button>
        <button style={{ fontSize: "20px" }} onClick={verifyData}>
          Verify Data
        </button>
      </div>
    </div>
  );
}


export default App;
