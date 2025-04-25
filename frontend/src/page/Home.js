import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('asc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchImages(page);
  }, [page, sort, itemsPerPage]);

  const fetchImages = async (page) => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/images`, {
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
    } finally {
      setLoading(false);
    }
  };

  const handlePagination = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    navigate(`/image/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Image Gallery</h1>
      
      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <label className="mr-2 text-gray-700 font-medium">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="mr-2 text-gray-700 font-medium">Sort by:</label>
              <select
                value={sort}
                onChange={(e) => handleSort(e.target.value)}
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ASC">Oldest First</option>
                <option value="DESC">Newest First</option>
              </select>
            </div>
          </div>

          <div className="text-gray-600">
            Showing {images.length} of {totalPages * itemsPerPage} images
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Images Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                onClick={() => handleImageClick(image.id)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${image.image_base64}`}
                    alt={`Image ${image.id}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">Image #{image.id}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(image.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-8 gap-4">
            <button
              disabled={page === 1 || loading}
              onClick={() => handlePagination(page - 1)}
              className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePagination(pageNum)}
                    className={`w-10 h-10 rounded-full ${page === pageNum ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                    disabled={loading}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && page < totalPages - 2 && (
                <span className="mx-1">...</span>
              )}
              {totalPages > 5 && page < totalPages - 2 && (
                <button
                  onClick={() => handlePagination(totalPages)}
                  className={`w-10 h-10 rounded-full ${page === totalPages ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                  disabled={loading}
                >
                  {totalPages}
                </button>
              )}
            </div>
            
            <button
              disabled={page === totalPages || loading}
              onClick={() => handlePagination(page + 1)}
              className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default HomePage;