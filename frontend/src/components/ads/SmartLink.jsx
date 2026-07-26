import { useState } from 'react';

export default function SmartLink({ href, children, className = '', style = {} }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
