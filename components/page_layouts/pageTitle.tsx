// components/PageTitle.jsx
export default function PageTitle({ children }) {
    return (
        <>
            <h1 className="page-title">{children}</h1>
            <style jsx>{`
        .page-title {
          font-size: 2.0rem; /* text-2xl */
          font-weight: 700; /* font-bold */
          margin-bottom: 1.5rem; /* mb-6 */
          background: linear-gradient(
            270deg,
            #3b82f6, /* blue-500 */
            #6366f1, /* violet-500 */
            #3b82f6
          );
          background-size: 600% 600%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientAnimation 6s ease infinite;
        }

        @keyframes gradientAnimation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
        </>
    );
}
