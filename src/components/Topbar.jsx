import { useState } from 'react';
import { User } from "lucide-react";

const TopNavbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="top-navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="navbar-logo">Takshaga</div>
        </div>
        
        <div className="navbar-right" style={{ marginLeft: 'auto' }}>
          <button className="profile-button" onClick={toggleDropdown}>
            <div className="avatar">
              <User size={20} />
            </div>
            <span className="username">sachu saji</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopNavbar;