import React from 'react';
import { BiLogOut, BiLogIn, BiUser } from 'react-icons/bi';
import './Header.css';

const Header = ({ isAuthenticated, user, onLoginClick, onLogout, exportButton }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <div className="header-logo">
            <img src="/logo.png" alt="EPiC Structural Logo" className="logo-image" />
          </div>
          <h1 className="header-title">EPiC Structural</h1>
        </div>
        
        <div className="header-actions">
          {isAuthenticated && exportButton && (
            <div className="header-export">
              {exportButton}
            </div>
          )}
          
          {isAuthenticated ? (
            <div className="user-section">
              <div className="user-info">
                <BiUser size={16} />
                <span className="username">{user?.username}</span>
                {user?.role && (
                  <span className="user-role">({user.role})</span>
                )}
              </div>
              <button className="logout-button" onClick={onLogout}>
                <BiLogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <button className="login-button" onClick={onLoginClick}>
              <BiLogIn size={16} />
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
