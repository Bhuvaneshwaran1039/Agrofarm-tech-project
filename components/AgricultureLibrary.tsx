import React from 'react';
import { User } from '../types';

const books = [
  {
    title: 'Principles of Agronomy',
    author: 'T.Y. Reddy',
    link: 'https://archive.org/details/principlesofagro00redd',
  },
  {
    title: 'Soil Science and Management',
    author: 'Edward Plaster',
    link: 'https://archive.org/details/soilsciencemanag00plas',
  },
  {
    title: 'Plant Pathology',
    author: 'George N. Agrios',
    link: 'https://archive.org/details/plantpathology00agri',
  },
  {
    title: 'The Nature and Properties of Soils',
    author: 'Nyle C. Brady',
    link: 'https://archive.org/details/natureproperties00brad',
  },
  {
    title: 'Agricultural Meteorology',
    author: 'G.S. Manku',
    link: 'https://archive.org/details/agriculturalmete00mank',
  },
];

const externalResources = [
  {
    name: 'FAO eBooks',
    url: 'https://www.fao.org/publications/e-books/en/',
  },
  {
    name: 'National Agricultural Library',
    url: 'https://www.nal.usda.gov/',
  },
  {
    name: 'AgriKnowledge',
    url: 'https://www.agriknowledge.org/',
  },
];

const AgricultureLibrary: React.FC<{ user: User }> = ({ user }) => {
  if (user.role !== 'Researcher') return null;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary mb-4">📚 Agriculture Library</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Featured Books</h3>
        <ul className="space-y-2">
          {books.map((book) => (
            <li key={book.title} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg shadow hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <a href={book.link} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                {book.title}
              </a>
              <span className="block text-sm text-text-light dark:text-slate-400">by {book.author}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">External Resources</h3>
        <ul className="space-y-2">
          {externalResources.map((res) => (
            <li key={res.url}>
              <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-secondary font-semibold hover:underline">
                {res.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AgricultureLibrary;
