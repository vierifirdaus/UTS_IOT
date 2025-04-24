import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);  // Jumlah data per halaman
  const [sort, setSort] = useState('timestamp');  // Default sorting by timestamp

  // Fetch images with pagination and sorting
  const fetchImages = async (page, sort, limit) => {
    try {
      const response = await axios.get('http://localhost:5000/images', {
        params: {
          page: page,
          sort: sort,
          limit: limit,  // Mengatur jumlah data per halaman
        }
      });
      setImages(response.data.images);
      setTotalPages(Math.ceil(response.data.total / limit));  // Hitung total halaman berdasarkan total gambar
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  useEffect(() => {
    fetchImages(page, sort, itemsPerPage);  // Memanggil fetchImages dengan parameter baru
  }, [page, sort, itemsPerPage]);  // Mengupdate data saat page, sort, atau itemsPerPage berubah

  const handlePagination = (newPage) => {
    setPage(newPage);
  };

  const handleSort = (newSort) => {
    setSort(newSort);
    setPage(1);  // Reset ke halaman pertama saat pengurutan berubah
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));  // Update jumlah data per halaman
    setPage(1);  // Reset ke halaman pertama ketika jumlah data per halaman berubah
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-6">Image Dashboard</h1>

      {/* Input untuk memilih jumlah data per halaman */}
      <div className="flex justify-start mb-4">
        <label className="mr-2">Items per page:</label>
        <select
          className="px-4 py-2 rounded"
          value={itemsPerPage}
          onChange={handleItemsPerPageChange}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Pilihan Sort */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => handleSort('timestamp')}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Sort by Timestamp Asc
        </button>
        <button
          onClick={() => handleSort('timestamp DESC')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sort by Timestamp Desc
        </button>
      </div>

      {/* Menampilkan Gambar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div key={image.id} className="border p-4 rounded shadow-md">
            <img
              src={`data:image/jpeg;base64,${image.image_base64}`}
              alt="Image"
              className="w-full h-48 object-cover rounded mb-2"
            />
            <p className="text-sm text-gray-500">{image.timestamp}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page === 1}
          onClick={() => handlePagination(page - 1)}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Previous
        </button>
        <span className="text-lg">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => handlePagination(page + 1)}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default App;
