export const updateQueryParams = (params, setSearchParams) => {
    const updatedParams = new URLSearchParams(params.toString());
  
    // Clean empty values (optional)
    for (const [key, value] of updatedParams.entries()) {
      if (!value.trim()) {
        updatedParams.delete(key);
      }
    }
  
    setSearchParams(updatedParams);
  };
  