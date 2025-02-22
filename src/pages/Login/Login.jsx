import Navbar from "../../components/Navbar.jsx";
import {login, signup} from "../../firebase.js";
import {useState} from "react";


const Login = () => {

    const [signState, setSignState] = useState("Sign In")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState()
    const [user, setUser] = useState(null);

    const user_auth = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (signState === "Sign In") {
                const loggedInUser = await login(email, password)
                setUser(loggedInUser)
                window.location.reload()
            } else {
                const signedUpUser = await signup(name, email, password)
                setUser(signedUpUser)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    };

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center min-h-screen bg-gray-100">
                    <h1 className="text-xl font-semibold">Patientez...</h1>
                </div>
            ) : (
                <div className="login flex justify-center items-center min-h-screen bg-gray-100">
                    <div className="bg-white/70 p-8 rounded-lg shadow-lg w-full max-w-sm">
                        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">
                            {signState}
                        </h1>
                        <form className="space-y-4">
                            {signState === "Sign Up" ? (
                                <input
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                    }}
                                    type="text"
                                    placeholder="Your Name"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            ) : null}

                            <input
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                }}
                                type="email"
                                placeholder="Email"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                }}
                                type="password"
                                placeholder="Password"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={user_auth}
                                type="submit"
                                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {signState}
                            </button>
                            
                        </form>

                        <div className="text-center mt-4 text-sm text-gray-600">
                            {signState === "Sign In" ? (
                                <p>
                                    New to TCHAT?{" "}
                                    <span
                                        onClick={() => setSignState("Sign Up")}
                                        className="text-blue-600 cursor-pointer hover:underline"
                                    >
                                Sign Up Now
                            </span>
                                </p>
                            ) : (
                                <p>
                                    Already have an account?{" "}
                                    <span
                                        onClick={() => setSignState("Sign In")}
                                        className="text-blue-600 cursor-pointer hover:underline"
                                    >
                                Sign In Now
                            </span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Login;