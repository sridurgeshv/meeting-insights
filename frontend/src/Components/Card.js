import React, { useState } from 'react';
import { X } from 'lucide-react';
import '../globals/styles.css';

const Card = ({ id, language, title, timeAgo, onClick, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div 
      className="card" 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-header">
        <span>{language}</span>
        {isHovered && (
          <X 
            size={16} 
            className="delete-icon" 
            onClick={handleDelete}
          />
        )}
      </div>
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
      </div>
      <div className="card-footer">{timeAgo}</div>
    </div>
  );
};

export default Card;