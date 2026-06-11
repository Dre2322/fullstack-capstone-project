import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { urlConfig } from '../../config';
import './DetailsPage.css';

function DetailsPage() {
    const [gift, setGift] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchGiftDetails = async () => {
            try {
                const response = await fetch(`${urlConfig.backendUrl}/api/gifts/${id}`);

                if (!response.ok) {
                    throw new Error('Gift not found');
                }

                const data = await response.json();
                setGift(data);
            } catch (err) {
                console.error('Error fetching gift details:', err);
                setError('Unable to load gift details.');
            }
        };

        fetchGiftDetails();
    }, [id]);

    const handleBackClick = () => {
        navigate(-1);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) {
            return 'Date unavailable';
        }

        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString();
    };

    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">{error}</div>
                <button className="btn btn-secondary" onClick={handleBackClick}>
                    Back
                </button>
            </div>
        );
    }

    if (!gift) {
        return (
            <div className="container mt-5">
                <p>Loading gift details...</p>
            </div>
        );
    }

    const comments = gift.comments || [];

    return (
        <div className="container mt-5">
            <button className="btn btn-secondary mb-4" onClick={handleBackClick}>
                Back
            </button>

            <div className="card">
                <div className="card-header">
                    <h2 className="details-title">{gift.name}</h2>
                </div>

                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6 image-placeholder-large">
                            {gift.image ? (
                                <img
                                    src={gift.image}
                                    alt={gift.name}
                                    className="product-image-large"
                                />
                            ) : (
                                <div className="no-image-available-large">
                                    No Image Available
                                </div>
                            )}
                        </div>

                        <div className="col-md-6">
                            <p><strong>Category:</strong> {gift.category}</p>
                            <p><strong>Condition:</strong> {gift.condition}</p>
                            <p><strong>Posted By:</strong> {gift.posted_by}</p>
                            <p><strong>Zipcode:</strong> {gift.zipcode}</p>
                            <p><strong>Date Added:</strong> {formatDate(gift.date_added)}</p>
                            <p><strong>Age:</strong> {gift.age_years} years</p>
                            <p><strong>Description:</strong> {gift.description}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="comments-section mt-4">
                <h4>Comments</h4>

                {comments.length > 0 ? (
                    comments.map((comment, index) => (
                        <div key={index} className="border rounded p-3 mb-2">
                            <p>{comment.text || comment.comment || comment}</p>
                        </div>
                    ))
                ) : (
                    <p>No comments yet.</p>
                )}
            </div>
        </div>
    );
}

export default DetailsPage; 
