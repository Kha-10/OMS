import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Form,
} from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { DevTool } from "@hookform/devtools";
import { Button } from "@/components/ui/button";
import Title from "@/components/Options/Forms/Title";
import DeleteDialog from "@/components/Options/Forms/DeleteDialog";
import OptLists from "@/components/Options/Forms/OptLists";
import Rules from "@/components/Options/Forms/Rules";
import Upto from "@/components/Options/Forms/Upto";
import axios from "../helper/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NewOption = () => {
  const [isDeleteOpened, setIsDeleteOpened] = useState(false);
  const form = useForm({
    defaultValues: {
      title: "",
      options: [{ name: "", price: "", type: "number" }],
      type: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const navigate = useNavigate();

  const { id } = useParams();

  const showToast = (toastId, message, type = "success") => {
    toast.update(toastId, {
      render: message,
      type,
      isLoading: false,
      autoClose: 3000,
      closeOnClick: true,
      theme: "colored",
      position: "top-center",
    });
  };

  const onSubmit = async (data) => {
    const toastId = toast.loading(
      id ? "Updating new option group..." : "Adding new option group...",
      { position: "top-center" }
    );

    try {
      const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});
      let res;
      if (id) {
        res = await axios.patch("/api/optionGroups/" + id, filteredData);
      } else {
        res = await axios.post("/api/optionGroups/", filteredData);
      }
      if (res.status == 200) {
        let state = {
          type: "success",
        };
        if (id) {
          state.menuId = id;
          state.todo = "update";
        }
        navigate("/Menus/Option_Groups", {
          state,
        });
      }
    } catch (error) {
      console.log("Error submitting the form", error);
      const missingFields = [];
      if (error?.response?.data?.errors?.title?.msg)
        missingFields.push("title");
      if (error?.response?.data?.errors?.options?.msg) {
        missingFields.push("options");
      }
      if (missingFields.length > 0) {
        showToast(
          toastId,
          `Invalid ${missingFields.join(", ")} ${
            missingFields.length > 1 ? "values" : "value"
          }`,
          "error"
        );
      } else {
        showToast(toastId, "Something went wrong during submission!", "error");
      }
    }
  };

  useEffect(() => {
    const getMenu = async () => {
      if (id) {
        try {
          const url = `/api/optionGroups/${id}`;
          const res = await axios.get(url);

          if (res.status === 200 && res.data) {
            const { title, options, type, fixedOptionValue, exactly, between } =
              res.data[0];
            console.log(title);
            form.setValue("title", title);
            replace(options);

            if (type) form.setValue("type", type);
            if (fixedOptionValue)
              form.setValue("fixedOptionValue", fixedOptionValue);
            if (exactly !== undefined) form.setValue("exactly", exactly);
            if (between !== undefined) form.setValue("between", between);
          }
        } catch (error) {
          console.error("Error fetching menu:", error);
        }
      }
    };

    getMenu();
  }, [id]);

  const options = form.getValues("options");

  const fixedOptionRange = ["Exactly", "Between"];

  useEffect(() => {
    if (form.getValues("fixedOptionValue") == "Between") {
      form.setValue("between", options.length);
    }
  }, [form.watch("fixedOptionValue")]);

  useEffect(() => {
    if (form.getValues("type") == "rule1") {
      if (!form.getValues("fixedOptionValue")) {
        form.setValue("fixedOptionValue", "Exactly");
        form.setValue("exactly", 1);
        form.setValue("between", null);
        form.setValue("upto", null);
      } else if (form.getValues("fixedOptionValue") == "Exactly") {
        form.setValue("between", null);
      } else if (form.getValues("fixedOptionValue") == "Between") {
        form.setValue("between", options.length);
        form.setValue("upto", null);
      }
    }
    if (form.getValues("type") == "rule2") {
      form.setValue("upto", form.getValues("options").length);
      form.setValue("fixedOptionValue", null);
      form.setValue("exactly", null);
      form.setValue("between", null);
    }
  }, [
    form.watch("type"),
    form.watch("options"),
    form.watch("fixedOptionValue"),
  ]);

  return (
    <div className="space-y-3 max-w-screen-lg mx-auto mt-3">
      <h1 className="text-xl font-semibold">
        {id ? "Edit option group" : "Add option group"}
      </h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5 bg-white p-5 rounded-lg shadow-sm border border-slate-200"
        >
          <Title form={form} id={id} setIsDeleteOpened={setIsDeleteOpened}/>
          <DeleteDialog isDeleteOpened={isDeleteOpened} setIsDeleteOpened={setIsDeleteOpened} id={id}/>
          <OptLists form={form} append={append} fields={fields} options={options} remove={remove}/>
          <Rules form={form} fixedOptionRange={fixedOptionRange} options={options}/>
          <Upto form={form} options={options}/>
          <Button className="bg-orange-500 text-white">
            {id ? "Update" : "Submit"}
          </Button>
        </form>
      </Form>
      <ToastContainer />
      <DevTool control={form.control} />
    </div>
  );
};

export default NewOption;