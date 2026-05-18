import { useState, useEffect, useRef } from 'react';
import axiosClient from '../utils/axiosClient';

export default function AutocompleteInput({ placeholder, value, onChange, icon }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (term) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const { data } = await axiosClient.get(`/api/v1/jobsearch/autocomplete?term=${term}`);
      setSuggestions(data);
      setIsOpen(true);
    } catch (error) {
      console.error("Autocomplete error", error);
    }
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
    fetchSuggestions(e.target.value);
  };

  const handleSelect = (item) => {
    onChange(item);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex items-center bg-white border border-gray-300 rounded-md p-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 h-full">
        <span className="text-gray-400 mr-2">{icon}</span>
        <input 
          type="text" 
          value={value}
          onChange={handleInputChange}
          onFocus={() => { if(suggestions.length > 0) setIsOpen(true); }}
          placeholder={placeholder} 
          className="w-full focus:outline-none text-gray-700 bg-transparent text-lg"
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item, index) => (
            <li 
              key={index} 
              onClick={() => handleSelect(item)}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-700 border-b border-gray-50 last:border-b-0"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
