import React from 'react';

function Card({ children, title, className = '' }) {
  return (
    <div className={`card-pro ${className}`}>
      {title && <div className="card-pro-body" style={{borderBottom: '1px solid var(--gray-100)', padding: '1rem 1rem 0.5rem'}}>
        <h3 style={{margin:0, fontSize: '1.125rem'}}>{title}</h3>
      </div>}
      <div className="card-pro-body">{children}</div>
    </div>
  );
}

export default Card;
