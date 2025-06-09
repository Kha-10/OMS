import { useState, useEffect } from "react";
import axios from "../helper/axios";
import OptionGroups from "@/components/Options/OptionGroups";
import Options from "@/components/Options/Options";
import AddandSearch from "@/components/Options/AddandSearch";
import { AddandSearchSkeleton } from "@/components/LoadingSkeleton";
import { CategorySkeleton } from "@/components/LoadingSkeleton";
import { MenuSkeleton } from "@/components/LoadingSkeleton";
import NoOptions from "@/components/Options/NoOptions";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useNavigate } from "react-router-dom";
import { showToast } from "@/helper/showToast";

function Option() {
  const [optionGroups, setOptionGroups] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const getRecipes = async () => {
    setLoading(true);
    try {
      let url = "/api/optionGroups";

      const res = await axios.get(url);
      if (res.status === 200) {
        setOptionGroups(res.data);
        setOptions(res.data);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  let getOptionGroupsById = async (id) => {
    try {
      let url = "/api/optionGroups/" + id;
      const res = await axios(url);
      console.log('gg',res.data);
      if (res.status === 200) {
        setOptions(res.data);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  useEffect(() => {
    getRecipes();
  }, []);

  const deleteOptionGroupHandler = async (id) => {
    let toastId = null;
    try {
      if (id) {
        toastId = toast.loading("Deleting Option Group...", {
          position: "top-center",
        });
        const res = await axios.delete("/api/optionGroups/" + id);
        if (res.status == 200) {
          setOptionGroups((prev) => prev.filter((p) => p._id !== id));
          setOptions((prev) => prev.filter((p) => p._id !== id))
          showToast(toastId,"Option Group deleted successfully","success");
        }
      }
    } catch (error) {
      console.error("Error deleting the form", error);
      showToast(toastId,"Failed to delete option group. Please try again.","error");
    }
  };

  useEffect(() => {
    let toastId;
    if (location.state?.menuId) {
      toastId = toast("Option group updated successfully");
    } else if (location.state) {
      toastId = toast("New Option group added successfully");
    }
    console.log(toastId);
    let toastMessage;
    if (location.state?.menuId && location.state?.todo == "update") {
      toastMessage = "Option group updated successfully";
    } else if (location.state?.menuId && location.state?.todo == "delete") {
      toastMessage = "Option group deleted successfully";
    } else {
      toastMessage = "New Option group added successfully";
    }

    if (location.state || location.state?.menuId) {
      showToast(toastId, toastMessage, location.state?.type);

      navigate(location.pathname, { replace: true });
    }
    return () => {
      toast.dismiss(toastId);
    };
  }, []);

  return (
    <div className="max-w-screen-lg mx-auto overflow-hidden mt-3 space-y-3">
      {loading && options.length === 0 ? (
        <AddandSearchSkeleton />
      ) : (
        <AddandSearch
          setOptionGroups={setOptionGroups}
          setOptions={setOptions}
        />
      )}

      {options.length > 0 ? (
        <div className="flex gap-6">
          {loading ? (
            <CategorySkeleton />
          ) : (
            <OptionGroups
              optionGroups={optionGroups}
              deleteOptionGroupHandler={deleteOptionGroupHandler}
              getOptionGroupsById={getOptionGroupsById}
            />
          )}
          {loading ? (
            <MenuSkeleton />
          ) : (
            <Options options={options} />
          )}
        </div>
      ) : (
        !loading && <NoOptions />
      )}
      <ToastContainer />
    </div>
  );
}

export default Option;