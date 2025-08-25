import Link from "next/link";
import GoogleLogo from "./google-logo";

function LoginForm({
  handleSubmit,
  handleChange,
  formData,
  errors,
  showGoogleSignIn = true,
  showRegisterLink = true,
  isSystemAdmin = false,
  message,
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Hestia Logo</h1>

        {/* Display message */}
        {message && (
          <div
            className={`text-center py-2 mb-4 rounded-md ${
              message.type === "success"
                ? "bg-green-200 text-green-800"
                : "bg-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>

          {/*  "Forgot Password" only if it's not the System Admin */}
          {!isSystemAdmin && (
            <p className="text-center">
              <Link
                href="./forgot-password"
                className="text-blue-600 hover:text-blue-900 hover:cursor-pointer hover:underline"
              >
                Forgot Password?
              </Link>
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        {/* Divider for Google Login */}
        {showGoogleSignIn && !isSystemAdmin && (
          <>
            <div className="flex items-center my-6">
              <div className="border-t border-gray-300 flex-grow"></div>
              <span className="mx-3 text-gray-500 font-medium">or</span>
              <div className="border-t border-gray-300 flex-grow"></div>
            </div>

            {/* Login with Google */}
            <button
              type="button"
              className="w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition"
            >
              <GoogleLogo className="mr-2" />
              <span className="font-medium text-gray-700">
                Login with Google
              </span>
            </button>
          </>
        )}

        {showRegisterLink && !isSystemAdmin && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Don&#39;t have an account?{" "}
            <Link
              href="../auth/register"
              className="text-blue-600 hover:underline font-medium"
            >
              Create Now
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default LoginForm;
