import { createContext, useReducer,useState } from "react";

const AuthContext = createContext()

const AuthContextProvider = ({ children }) => {
  const AuthReducer = (state, action) => {
    switch (action.type) {
      case "LOGIN":
        localStorage.setItem("user", JSON.stringify(action.payload));
        return { user: action.payload };
      case "LOGOUT":
        localStorage.removeItem("user");
        return { user: null };
        case "REGISTER":
        localStorage.setItem("user",JSON.stringify(action.payload));
        return { user: action.payload };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(AuthReducer, {
    user: null,
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  // useEffect(() => {
  //   try {
  //     axios('/api/users/me').then(res => {
  //       console.log('mmsp');
  //       let isUserExisted = res.data
  //       if (isUserExisted) {
  //           dispatch({ type: "LOGIN", payload: isUserExisted });
  //         } else {
  //           dispatch({ type: "LOGOUT" });
  //         }
  //     })
  //   } catch (error) {
  //     dispatch({ type: "LOGOUT" });
  //   }
  // }, []);

  return (
    <AuthContext.Provider value={{ ...state, dispatch,loading,setLoading,error,setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthContextProvider };
