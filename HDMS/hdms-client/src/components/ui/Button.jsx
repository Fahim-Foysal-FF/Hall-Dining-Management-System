import React from 'react';

function Button({ children, className = '', onClick, type = 'button', ...rest }) {
  const classes = `btn-prim btn-polish ${className}`.trim();
  return (
    <button type={type} className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

export default Button;
