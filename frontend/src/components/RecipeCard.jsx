function RecipeCard({ recipe }) {
  return (
    <div className=" bg-white">
      <img className="w-[300px] h-[200px] object-cover" src={recipe.imgUrl} alt="" loading="lazy" />
      <div className="p-2 space-y-2">
        <h3 className="text-sm">{recipe.title}</h3>
        <div className="space-x-1">
          <span className="text-orange-500 bg-slate-50 border border-slate-200 text-xs p-1 rounded-md">
            {recipe?.category?.title}
          </span>
        </div>
        <p className="text-lg">฿{recipe.price}</p>
      </div>
    </div>
  );
}

export default RecipeCard;