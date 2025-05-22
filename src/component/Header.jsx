import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { mainMenuItems, infoMenuItems } from '../config';

function Header() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand fw-bolder" to="/">Seikowo Team</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
          aria-controls="navMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto">
            {mainMenuItems.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink to={item.to} className="nav-link">{item.label}</NavLink>
              </li>
            ))}

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="infoDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Thông tin
              </a>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="infoDropdown">
                {infoMenuItems.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} className="dropdown-item">{item.label}</NavLink>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Header;
