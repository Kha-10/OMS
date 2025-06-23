import { useEffect, useState } from "react"
import axios from "axios";
import RecipeCard from "../components/RecipeCard";

function Home() {

  const [recipes,setRecipes] = useState([]);

  useEffect(()=> {
    const fetchRecipes = async() => {
      const response = await axios.get('http://localhost:8000/api/recipes');
      setRecipes(response.data)
      console.log(response);
    }
    fetchRecipes ()
  },[])

  return (
    <div className="space-y-3 max-w-screen-sm mx-auto">
     {!!recipes.length && (recipes.map((recipe) => (
      <RecipeCard recipe={recipe} key={recipe._id}/>
     )))}
    </div>
  )
}

export default Home