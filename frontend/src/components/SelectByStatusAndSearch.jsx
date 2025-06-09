import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, CircleX } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import axios from "@/helper/axios";
import { useNavigate } from "react-router-dom";

const SelectByStatusAndSearch = ({ setRecipes, setMenus, queryStatus }) => {
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState(null);
  const debouncedValue = useDebounce(search, 1000);

  const allStatus = [
    { id: "all", title: "All" },
    { id: "upcoming", title: "Upcoming" },
    { id: "active", title: "Active" },
    { id: "expired", title: "Expired" },
  ];

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = debouncedValue
          ? `/api/recipes?query=${debouncedValue}`
          : "/api/recipes";
        const res = await axios.get(api);
        if (res.status === 200) {
          setRecipes(res.data.data);
          setMenus(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };
    if(debouncedValue) {
        navigate('/Menus/Menu_Overview', { replace: true });
    }
    if(!queryStatus) {
        fetchData();
    }
  }, [debouncedValue]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        let api = "/api/recipes";
        if (statusValue && statusValue !== "all") {
          api = `/api/recipes?status=${statusValue}`;
        }
        const res = await axios.get(api);
        if (res.status === 200) {
          setRecipes(res.data.data);
          setMenus(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };

    if (statusValue) {
      fetchMenu();
    }
  }, [statusValue]);

  useEffect(() => {
    if (queryStatus) {
      setStatusValue(queryStatus);
    }
  }, [queryStatus]);
  console.log(statusValue);
  return (
    <div className="flex items-center justify-between ">
      <Select
        value={statusValue ? statusValue : ''}
        onValueChange={(value) => setStatusValue(value)}
      >
        <SelectTrigger className="w-[180px] focus:ring-offset-0 focus:outline-none focus:ring-0">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {!!allStatus &&
              allStatus.map((status, i) => (
                <div key={i}>
                  <SelectItem value={status.id}>{status.title}</SelectItem>
                </div>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="relative w-[30%]">
        {search ? (
          <CircleX
            className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={14}
            color="gray"
            onClick={() => setSearch("")}
          />
        ) : (
          <Search
            className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={14}
          />
        )}
        <Input
          placeholder="Search by item name"
          className="h-11 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
      </div>
    </div>
  );
};

export default SelectByStatusAndSearch;
