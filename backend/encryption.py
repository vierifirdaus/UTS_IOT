from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from config import AES_KEY

def encrypt_image(image_data):
    """Enkripsi gambar menggunakan AES CBC"""
    cipher = AES.new(AES_KEY, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(image_data, AES.block_size))
    iv = cipher.iv
    return iv + ct_bytes  

def decrypt_image(encrypted_data):
    """Dekripsi gambar menggunakan AES CBC"""
    iv = encrypted_data[:16]
    ct = encrypted_data[16:]
    cipher = AES.new(AES_KEY, AES.MODE_CBC, iv=iv)
    pt = unpad(cipher.decrypt(ct), AES.block_size)
    return pt
