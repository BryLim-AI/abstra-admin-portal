'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';


const feedbackDescriptions: Record<string, string> = {
  ui: 'Feedback about buttons, layout, colors, spacing, or visual consistency.',
  ux: 'Feedback about how intuitive or usable the experience is.',
  functionality: 'Report broken features or incorrect behavior.',
  system_performance: 'Report issues related to speed, crashes, or lag.',
  ui_and_func: 'When both the visuals and behavior of a feature have issues.',
  mobile_ui: 'Report layout/design problems on mobile screens.',
  mobile_function: 'Functionality not working properly on mobile devices.',
};




export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const pathname = usePathname();
const [feedbackType, setFeedbackType] = useState('General');

const handleSubmit = async () => {
    const res = await fetch('/api/feedback/submit-feedback', {
      method: 'POST',
      body: JSON.stringify({
        page: pathname,
        feedback,
        type: feedbackType,

      }),
    });

   if (res.ok) {
      setSubmitted(true);
      setFeedback('');
    setFeedbackType('General');

      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 2000);
    }
  };


return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center space-y-1">
  {/* 👋 Waving Hand */}
  <img
    src="/waving.gif" 
    alt="Waving Hand"
    className="w-20 h-20 animate-bounce"
  />

  {/* Feedback Button */}
  <button
    onClick={() => setIsOpen(true)}
    className="bg-red-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-red-700 animate-pulse-slow animate-wiggle"
  >
    Write a Feedback about this page.
  </button>
</div>


      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-2">Feedback for this page</h2>
<p className="text-sm text-gray-400 mb-4">
Let us know your thoughts about this page—whether it’s related to the interface, functionality, or overall system experience.
</p>
{feedbackType && (
  <p className="text-sm text-red-500 mb-4 italic transition-all duration-200">
    {feedbackDescriptions[feedbackType] || 'Let us know your thoughts about this page.'}
  </p>
)}

            {submitted ? (
              <p className="text-green-600">Thank you for your feedback!</p>
            ) : (
              <>
              <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-1">
Issue Type
</label>
<select
 value={feedbackType}
  onChange={(e) => setFeedbackType(e.target.value)}
  className="w-full border border-gray-300 rounded-md p-2 mb-4 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
>
  <option value="">Select an issue</option>
  <option value="ui">User Interface (UI)</option>
  <option value="ux">User Experience (UX)</option>
  <option value="functionality">Functionality / Bug</option>
  <option value="system_performance">System Performance</option>
  <option value="ui_and_func">UI and Functionality</option>
    <option value="mobile_ui">Not Mobile Responsive</option>
    <option value="mobile_function">Mobile Function Not Working.</option>

</select>
                <textarea
                  className="w-full border rounded p-2 mb-4"
                  placeholder="Write your feedback here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );

}