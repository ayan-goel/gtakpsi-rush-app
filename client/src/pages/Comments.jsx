import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
// import Button from '../components/Button'; // Uncomment if you have a Button component

const Comments = () => {
  const navigate = useNavigate();
  const [commentsData, setCommentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.firstname || !user.lastname) {
          setError('User not logged in.');
          setLoading(false);
          return;
        }
        const brotherName = `${user.firstname} ${user.lastname}`;
        const api = import.meta.env.VITE_API_PREFIX || '';
        const res = await fetch(`${api}/brother/comments/${encodeURIComponent(brotherName)}`);
        const data = await res.json();
        if (data.status === 'success') {
          setCommentsData(data.payload);
        } else {
          setError(data.message || 'Failed to fetch comments.');
        }
      } catch (err) {
        setError('Failed to fetch comments.');
      }
      setLoading(false);
    };
    fetchComments();
  }, []);

  return (
    <div className="m-0 p-0 min-h-screen w-screen bg-slate-900 overflow-y-auto">
      <Navbar />
      <div className="max-w-4xl mx-auto bg-slate-700 shadow-lg rounded-lg p-6 mt-24">
        <h1 className="text-2xl font-bold mb-6 text-white">Your Comments</h1>
        {loading ? (
          <p className="text-gray-300">Loading...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : commentsData.length === 0 ? (
          <p className="text-gray-300">You haven't commented on any rushees yet.</p>
        ) : (
          <div className="space-y-6">
            {commentsData.map((entry, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row items-center bg-slate-600 rounded-lg p-4 shadow-md border border-gray-500"
              >
                <img
                  src={entry.rushee.image_url}
                  alt={`${entry.rushee.first_name} ${entry.rushee.last_name}`}
                  className="w-24 h-24 rounded-lg object-cover border-2 border-slate-500 mb-4 md:mb-0 md:mr-6"
                />
                <div className="flex-1 w-full">
                  <div className="flex flex-row gap-2 items-center mb-1">
                    <h2 className="text-xl font-bold text-white">
                      {entry.rushee.first_name} {entry.rushee.last_name}
                    </h2>
                    {entry.comments[0]?.night?.name && (
                      <span className="bg-gradient-to-r from-sky-700 to-amber-600 text-white text-xs font-semibold px-2 py-1 rounded ml-2">
                        {entry.comments[0].night.name}
                      </span>
                    )}
                  </div>
                  {entry.comments.map((comment, cidx) => (
                    <div key={cidx} className="mb-4">
                      <p className="text-gray-200 mb-2">{comment.comment}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {comment.ratings && comment.ratings.map((rating, rIdx) => (
                          <span
                            key={rIdx}
                            className="bg-slate-500 text-gray-200 px-2 py-1 rounded text-sm"
                          >
                            {rating.name}: {rating.value === 5 ? 'Satisfactory' : 'Unsatisfactory'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => navigate(`/brother/rushee/${entry.rushee.gtid}`)}
                    className="mt-2 bg-gradient-to-r from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                  >
                    View full profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments; 