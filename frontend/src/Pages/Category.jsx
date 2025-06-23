import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from "../components/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SequenceDialog } from "./SequenceDialog";
import { useNavigate } from "react-router-dom";
import { Minus } from "lucide-react";
import useCategories from "@/hooks/useCategories";
import useCategoriesActions from "@/hooks/useCategoriesActions";
import { useSearchParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Link } from "react-router-dom";

export default function CategoryPage() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCategoriesId, setSelectedCategoriesId] = useState([]);
  const [activeTab, setActiveTab] = useState("visible");
  const [isAllSelected, setIsAllSelected] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const page = parseInt(params.get("page") || "1", 10);
  const pageSize = parseInt(params.get("limit") || "10", 10);

  const { data, error } = useCategories({ page, pageSize });
  const categories = data?.data || [];
  const pagination = data?.pagination || {};
  const errorMessage = error?.response;

  const pages = Number(page) || 1;
  const pageSizes = Number(pageSize) || 10;
  const totalCategory = Number(pagination?.totalCategories) || 0;
  const startIndex = (pages - 1) * pageSizes + 1;
  const endIndex = Math.min(pages * pageSizes, totalCategory);

  const { deleteMutation, updateVisibilityMutation } = useCategoriesActions(
    null,
    null,
    setSelectedCategoriesId
  );
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false);

  const navigate = useNavigate();

  // Filter categories based on active tab
  const filteredCategories = categories.filter(
    (category) => category.visibility === activeTab
  );

  const toggleSelectAllIds = categories
    .filter((p) => p.visibility === activeTab)
    .map((p) => p._id);

  const toggleSelectAll = () => {
    if (selectedCategoriesId.length === toggleSelectAllIds.length) {
      setSelectedCategoriesId([]);
    } else {
      // console.log(selectedCategoriesId);
      // setSelectedCategoriesId(categories.map((p) => p._id && p.visibility === activeTab));
      console.log(selectedCategoriesId);
      setSelectedCategoriesId(toggleSelectAllIds);
    }
  };

  const toggleSelectProduct = (id) => {
    if (selectedCategoriesId.includes(id)) {
      setSelectedCategoriesId(selectedCategoriesId.filter((p) => p !== id));
    } else {
      setSelectedCategoriesId([...selectedCategoriesId, id]);
    }
  };

  // Clear selections when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedCategories(new Set());
    setIsAllSelected(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate(selectedCategoriesId);
  };

  const handleHideAndShow = () => {
    updateVisibilityMutation.mutate({
      selectedCategoriesId,
      visibility: activeTab,
    });
  };

  const createCategory = () => {
    navigate("/categories/new");
  };

  const handlePageChange = (newPage) => {
    params.set("page", newPage);
    setSearchParams(params);
  };

  const handlePageSizeChange = (newPageSize) => {
    params.set("page", 1);
    params.set("limit", newPageSize);
    setSearchParams(params);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Category</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-gray-100"
            onClick={() => setIsSequenceDialogOpen(true)}
          >
            Change sequence
          </Button>
          <Button
            onClick={createCategory}
            className="bg-blue-500 text-white hover:bg-blue-700"
          >
            Create category
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 ">
        <div className="border-b">
          <div className="flex gap-8 px-6 bg-white rounded-t-xl">
            <button
              className={`py-3 px-1 text-sm font-medium ${
                activeTab === "visible"
                  ? "border-b-2 border-blue-500 -mb-px"
                  : "text-gray-500"
              }`}
              onClick={() => handleTabChange("visible")}
            >
              Visible
            </button>
            <button
              className={`py-3 px-1 text-sm font-medium ${
                activeTab === "hidden"
                  ? "border-b-2 border-blue-500 -mb-px"
                  : "text-gray-500"
              }`}
              onClick={() => handleTabChange("hidden")}
            >
              Hidden
            </button>
          </div>
        </div>

        <div className="divide-y">
          <div className="px-6 py-3 flex items-center gap-2 h-[52px] bg-gray-50 rounded-b-xl">
            <div className="relative">
              <Checkbox
                id="select-all"
                checked={
                  categories.length > 0 &&
                  selectedCategoriesId.length === categories?.length
                }
                onCheckedChange={toggleSelectAll}
                className={`peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300 ${
                  selectedCategoriesId.length > 0 &&
                  !selectedCategoriesId.length !== categories?.length
                    ? "bg-blue-500 border-blue-500"
                    : ""
                }`}
              />
              {selectedCategoriesId.length > 0 &&
                selectedCategoriesId.length !== categories?.length && (
                  <Minus className="h-3 w-3 absolute top-[5px] left-[2px] text-white bg-blue-500 pointer-events-none" />
                )}
            </div>
            {selectedCategoriesId.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions({selectedCategoriesId.length} selected)
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleHideAndShow}>
                    {activeTab === "visible" ? "Hide" : "Show"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleDelete}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <label htmlFor="select-all" className="text-sm font-medium">
                Category
              </label>
            )}
          </div>

          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className="px-6 py-3 flex items-center h-[52px]"
            >
              <div className="flex items-center flex-1 gap-2">
                <Checkbox
                  id={category._id}
                  checked={selectedCategoriesId.includes(category._id)}
                  onCheckedChange={() => toggleSelectProduct(category._id)}
                  className="border-gray-300 peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Link to={`/categories/${category._id}`}>
                  <label
                    htmlFor={category._id}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">
                      ({category.products?.length || 0})
                    </span>
                  </label>
                </Link>
              </div>
              <span
                className={`text-xs font-medium rounded-full px-2 py-1 ${
                  category.visibility == "visible"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {category.visibility == "visible" ? "Visible" : "Hidden"}
              </span>
            </div>
          ))}
          <div
            className={`flex items-center justify-center px-6 py-4 border-t border-gray-200`}
          >
            {filteredCategories.length > 0 ? (
              <div className="w-full flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {startIndex} to {toggleSelectAllIds.length} of{" "}
                  {toggleSelectAllIds.length} products
                </div>
                <div className="flex items-center gap-4">
                  <Pagination
                    currentPage={page}
                    totalPages={pagination?.totalPages}
                    hasPreviousPage={pagination?.hasPreviousPage}
                    hasNextPage={pagination?.hasNextPage}
                    onPageChange={handlePageChange}
                  />
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) =>
                      handlePageSizeChange(Number(value))
                    }
                  >
                    <SelectTrigger className="w-[70px] h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select page size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No Categories found.</p>
            )}
          </div>
        </div>
      </div>

      <SequenceDialog
        open={isSequenceDialogOpen}
        onOpenChange={setIsSequenceDialogOpen}
        categories={categories}
      />
       <ToastContainer />
    </div>
  );
}
