import crypton from "crypto-js";

export const encryptText=(text)=>{
    return crypton.AES.encrypt(text,process.env.ENCRYPT_KEY).toString();
};

export const decryptText=(encryptText)=>{
    const bytes=crypton.AES.decrypt(encryptText,process.env.ENCRYPT_KEY);
    return bytes.toString(crypton.enc.Utf8);
};