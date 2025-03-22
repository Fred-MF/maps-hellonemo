import React from 'react';
import { Route } from '../types/api';
import { Map, Clock, Info } from 'lucide-react';

interface LineDetailTabsProps {
  activeTab: 'timeline' | 'map' | 'info';
  onTabChange: (tab: 'timeline' | 'map' | 'info') => void;
  line: Route;
}

const LineDetailTabs: React.FC<LineDetailTabsProps> = ({ activeTab, onTabChange, line }) => {
  const tabs = [
    {
      id: 'timeline' as const,
      name: 'Parcours',
      icon: Clock,
      count: line.patterns?.[0]?.stops?.length || 0
    },
    {
      id: 'map' as const,
      name: 'Carte',
      icon: Map
    },
    {
      id: 'info' as const,
      name: 'Infos',
      icon: Info
    }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 group inline-flex items-center justify-center py-4 px-1 border-b-2 font-medium text-sm
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <tab.icon
                className={`
                  h-5 w-5 sm:mr-2
                  ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                `}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{tab.name}</span>
              {tab.count > 0 && (
                <span
                  className={`
                    hidden sm:inline-block ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium
                    ${isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-900'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default LineDetailTabs;