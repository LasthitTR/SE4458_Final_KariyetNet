import { Link } from 'react-router-dom';

export default function JobCard({ job }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{job.title}</h3>
          <p className="text-gray-600 font-medium">{job.companyName}</p>
        </div>
        <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-2">
          {job.workingType || 'Tam Zamanlı'}
        </span>
      </div>
      
      <div className="flex items-center text-sm text-gray-500 mb-6 space-x-4">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          {job.city}{job.town ? `, ${job.town}` : ''}
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          {job.workingPreference || 'İş Yerinde'}
        </div>
      </div>
      
      <div className="mt-auto">
        <Link to={`/job/${job.id}`} className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-blue-600 font-semibold py-2.5 rounded-lg border border-gray-200 transition-colors">
          İlanı İncele
        </Link>
      </div>
    </div>
  );
}
