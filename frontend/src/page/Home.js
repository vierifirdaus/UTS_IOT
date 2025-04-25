import { useState, useEffect } from 'react';
import axios from 'axios';

function HomePage() {
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('asc');  
  const [itemsPerPage, setItemsPerPage] = useState(10); 

  useEffect(() => {
    fetchImages(page);
  }, [page, sort, itemsPerPage]);

  const fetchImages = async (page) => {
    try {
      const response = await axios.get('http://localhost:5000/images', {
        params: {
          page: page,
          timestamp: sort,
          limit: itemsPerPage,
        },
      });
      setImages(response.data.images);
      setTotalPages(Math.ceil(response.data.total / itemsPerPage));  
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handlePagination = (newPage) => {
    setPage(newPage);
  };

  const handleSort = (newSort) => {
    setSort(newSort);
    setPage(1);  
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value)); 
    setPage(1); 
  };

  const handleImageClick = (id) => {
    window.location.href = `http://localhost:5000/images/decrypt/${id}`;
  };

  return (
    <div>
      <div className="gap-10">
        <div className="flex flex-col space-y-4 gap-5">
          <div className="flex items-center">
            <label className="mr-2 text-gray-700 text-sm font-medium">Limit</label>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="block appearance-none bg-blue-500 text-white py-2 px-4 rounded"
            >
              <option className='bg-white text-slate-800' value={10}>10</option>
              <option className='bg-white text-slate-800' value={50}>50</option>
              <option className='bg-white text-slate-800' value={100}>100</option>
            </select>

            <label className="mr-2 text-gray-700 text-sm font-medium">Sort by Timestamp</label>
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value)}
              className="block appearance-none bg-blue-500 text-white py-2 px-4 rounded"
            >
              <option className='bg-white text-slate-800' value="ASC">Ascending</option>
              <option className='bg-white text-slate-800' value="DESC">Descending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="border p-4 rounded-lg shadow-md transition-transform hover:scale-105"
                onClick={() => handleImageClick(image.id)} 
              >
                <img
                  width={480}
                  height={640}
                  src={`data:image/jpeg;base64,${image.image_base64}`}
                  alt="Image"
                  className="object-cover rounded mb-2"
                />
                <p className="text-sm text-gray-500">{image.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page === 1}
          onClick={() => handlePagination(page - 1)}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-lg">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => handlePagination(page + 1)}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default HomePage;
