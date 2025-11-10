import React, { useState } from 'react';
import RouteMap from './RouteMap';

const ItineraryDisplay = ({ content }) => {
  // Carousel state
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  // Check if this is an itinerary (contains "Day" headers) or just a message
  const isItinerary = content.includes('Day ') && (
    content.includes('Route:') ||
    content.includes('Driving:') ||
    content.includes('- Route:') ||
    content.includes('- Driving:') ||
    content.includes('DAY_SECTIONS:') ||
    content.includes('SUMMARY_SECTIONS:')
  );

  if (!isItinerary) {
    // Just display as a regular message
    return (
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Trip Plan:</h3>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{content}</p>
      </div>
    );
  }

  // Parse the itinerary into days
  const parseItinerary = (text) => {
    const sections = [];

    // Check for structured format with delimiters
    if (text.includes('DAY_SECTIONS:') && text.includes('SUMMARY_SECTIONS:')) {
      const daySectionMatch = text.match(/DAY_SECTIONS:\s*\n(.*?)SUMMARY_SECTIONS:/s);
      const summarySectionMatch = text.match(/SUMMARY_SECTIONS:\s*\n(.*)/s);

      if (daySectionMatch) {
        const dayContent = daySectionMatch[1].trim();
        const dayParts = dayContent.split('\n\n');

        for (const part of dayParts) {
          const trimmedPart = part.trim();
          if (!trimmedPart) continue;

          const lines = trimmedPart.split('\n');
          const firstLine = lines[0].trim();

          if (firstLine.match(/^Day \d+$/i)) {
            sections.push({
              type: 'day',
              title: firstLine,
              content: lines.slice(1).join('\n').trim(),
              dayNumber: parseInt(firstLine.split(' ')[1])
            });
          }
        }
      }

      if (summarySectionMatch) {
        const summaryContent = summarySectionMatch[1].trim();
        const summaryParts = summaryContent.split('\n\n');

        for (const part of summaryParts) {
          const trimmedPart = part.trim();
          if (!trimmedPart) continue;

          const lines = trimmedPart.split('\n');
          const firstLine = lines[0].trim();

          if (firstLine && !firstLine.startsWith('-')) {
            sections.push({
              type: 'summary',
              title: firstLine,
              content: lines.slice(1).join('\n').trim()
            });
          }
        }
      }
    } else {
      // Fallback to the old parsing method
      const parts = text.split('\n\n');

      for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart) continue;

        const lines = trimmedPart.split('\n');
        const firstLine = lines[0].trim();

        if (firstLine.match(/^Day \d+$/i)) {
          sections.push({
            type: 'day',
            title: firstLine,
            content: lines.slice(1).join('\n').trim(),
            dayNumber: parseInt(firstLine.split(' ')[1])
          });
        }
        else if (firstLine.includes('Estimated total') || firstLine === 'Notes' || firstLine.includes('total trip')) {
          sections.push({
            type: 'summary',
            title: firstLine,
            content: lines.slice(1).join('\n').trim()
          });
        }
      }
    }

    return sections;
  };

  // Parse content with structured sections for day itineraries
  const parseDayContent = (text) => {
    const lines = text.split('\n');
    const sections = {};
    let currentSection = null;
    let currentSubItems = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('- Route:')) {
        currentSection = 'route';
        sections.route = trimmed.substring(9).trim(); // Remove "- Route: "
      } else if (trimmed.startsWith('- Route Coordinates:')) {
        currentSection = 'routeCoordinates';
        sections.routeCoordinates = trimmed.substring(21).trim(); // Remove "- Route Coordinates: "
      } else if (trimmed.startsWith('- Driving:')) {
        currentSection = 'driving';
        sections.driving = trimmed.substring(11).trim(); // Remove "- Driving: "
      } else if (trimmed.startsWith('- Start time suggestion:')) {
        currentSection = 'startTime';
        sections.startTime = trimmed.substring(24).trim(); // Remove "- Start time suggestion: "
      } else if (trimmed.startsWith('- Notes:')) {
        currentSection = 'notes';
        sections.notes = trimmed.substring(9).trim(); // Remove "- Notes: "
      } else if (trimmed.startsWith('- Overnight:')) {
        currentSection = 'overnight';
        sections.overnight = {
          city: trimmed.substring(13).trim(), // Remove "- Overnight: "
          details: []
        };
        currentSubItems = sections.overnight.details;
      } else if ((trimmed.startsWith('  - ') || 
                 (trimmed.startsWith('- ') && 
                  (trimmed.includes('Accommodation options:') || 
                   trimmed.includes('Dining options:') || 
                   trimmed.includes('Why ')))) && currentSection === 'overnight') {
        // Sub-item under overnight - handle accommodation, dining, and why details
        const prefix = trimmed.startsWith('  - ') ? '  - ' : '- ';
        currentSubItems.push(trimmed.substring(prefix.length).trim());
      } else if (trimmed.startsWith('- ') && !currentSection) {
        // Other bullet points
        if (!sections.other) sections.other = [];
        sections.other.push(trimmed.substring(2).trim());
      }
    }

    return sections;
  };

  // Render structured day content
  const renderDayContent = (content) => {
    const parsed = parseDayContent(content);

    return (
      <div className="space-y-4">
        {parsed.route && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Route: </span>
                <span className="text-gray-700 dark:text-gray-300">{parsed.route}</span>
              </div>
            </div>

            {/* Route Map */}
            {parsed.routeCoordinates && (
              <RouteMap
                routeCoordinates={parsed.routeCoordinates}
                className="w-full"
              />
            )}
          </div>
        )}

        {parsed.driving && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Driving: </span>
              <span className="text-gray-700 dark:text-gray-300">{parsed.driving}</span>
            </div>
          </div>
        )}

        {parsed.startTime && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Start time suggestion: </span>
              <span className="text-gray-700 dark:text-gray-300">{parsed.startTime}</span>
            </div>
          </div>
        )}

        {parsed.notes && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Notes: </span>
              <span className="text-gray-700 dark:text-gray-300">{parsed.notes}</span>
            </div>
          </div>
        )}

        {parsed.overnight && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-start space-x-3 mb-2">
              <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Overnight: </span>
                <span className="text-gray-700 dark:text-gray-300">{parsed.overnight.city}</span>
              </div>
            </div>
            {parsed.overnight.details.length > 0 && (
              <div className="space-y-2">
                {parsed.overnight.details.map((detail, index) => {
                  if (detail.startsWith('Accommodation options:')) {
                    return (
                      <div key={index} className="ml-5">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">🏨 Accommodation:</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                          {detail.replace('Accommodation options:', '').trim()}
                        </div>
                      </div>
                    );
                  } else if (detail.startsWith('Dining options:')) {
                    return (
                      <div key={index} className="ml-5">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">🍽️ Dining:</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                          {detail.replace('Dining options:', '').trim()}
                        </div>
                      </div>
                    );
                  } else if (detail.startsWith('Why ')) {
                    return (
                      <div key={index} className="ml-5">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">📍 Why this location:</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                          {detail.replace(/^Why [^:]+:\s*/, '')}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-400 ml-5">
                        • {detail}
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        )}

        {parsed.other && parsed.other.length > 0 && (
          <div className="space-y-1">
            {parsed.other.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                <span className="text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Parse content with bullet points for summary sections
  const parseSummaryContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentList = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('- ')) {
        // This is a bullet point
        if (!currentList) {
          currentList = [];
          elements.push(currentList);
        }
        currentList.push(trimmed.substring(2)); // Remove the "- "
      } else if (trimmed === '') {
        // Empty line - end current list if exists
        currentList = null;
      } else {
        // Regular text - end any current list
        if (currentList) {
          currentList = null;
        }
        elements.push(trimmed);
      }
    }

    return elements;
  };

  // Render parsed summary content
  const renderSummaryContent = (content) => {
    const parsed = parseSummaryContent(content);

    return parsed.map((item, index) => {
      if (Array.isArray(item)) {
        // This is a list of bullet points
        return (
          <ul key={index} className="list-disc list-inside space-y-1 ml-4">
            {item.map((bullet, bulletIndex) => (
              <li key={bulletIndex} className="text-blue-800 dark:text-blue-200">
                {bullet}
              </li>
            ))}
          </ul>
        );
      } else {
        // This is regular text
        return (
          <p key={index} className="text-blue-800 dark:text-blue-200 mb-2 last:mb-0">
            {item}
          </p>
        );
      }
    });
  };

  const sections = parseItinerary(content);

  // Separate day and summary sections
  const daySections = sections.filter(section => section.type === 'day');
  const summarySections = sections.filter(section => section.type === 'summary');

  // Navigation functions
  const goToPrevious = () => {
    setCurrentDayIndex((prevIndex) => (prevIndex - 1 + daySections.length) % daySections.length);
  };

  const goToNext = () => {
    setCurrentDayIndex((prevIndex) => (prevIndex + 1) % daySections.length);
  };

  const goToDay = (index) => {
    setCurrentDayIndex(index);
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🗺️ Your Trip Itinerary</h3>

      {/* Day Carousel */}
      {daySections.length > 0 && (
        <div className="relative">
          {/* Current Day Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                  {daySections[currentDayIndex].dayNumber}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {daySections[currentDayIndex].title}
                </h4>
              </div>

              {/* Navigation Controls */}
              {daySections.length > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevious}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Previous day"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex space-x-1">
                    {daySections.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToDay(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentDayIndex
                            ? 'bg-blue-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        aria-label={`Go to day ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={goToNext}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Next day"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {renderDayContent(daySections[currentDayIndex].content)}
            </div>
          </div>
        </div>
      )}

      {/* Summary Sections */}
      {summarySections.map((section, index) => (
        <div
          key={index}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
        >
          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            {section.title}
          </h4>
          <div className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
            {renderSummaryContent(section.content)}
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">{content}</p>
        </div>
      )}
    </div>
  );
};

export default ItineraryDisplay;