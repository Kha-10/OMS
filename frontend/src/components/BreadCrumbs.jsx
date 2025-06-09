import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "@/helper/axios";

const BreadCrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname;
  const pathNameArrays = pathnames.split("/").filter(Boolean);

  const excludedPathNameArrays = !pathNameArrays.some(path => ['sign-up', 'sign-in'].includes(path)); 

  const capitalizeFirstLetter = (string) => {
    // return string.charAt(0).toUpperCase() + string.slice(1);
    return string.split("_").join(" ");
  };
  const resourceType = pathNameArrays[1];
  const { id } = useParams();
  const [resourceTitle, setResourceTitle] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchResourceData = async () => {
        let apiUrl = "";

        switch (resourceType) {
          case "Menu_Overview":
            apiUrl = `/api/recipes/${id}`;
            break;
          case "Option_Groups":
            apiUrl = `/api/optionGroups/${id}`;
            break;
        //   case 'orders':
        //     apiUrl = `/api/orders/${resourceId}`;
        //     break;
          default:
            console.error('Unknown resource type');
            return;
        }

        try {
          const res = await axios.get(apiUrl);
          if (resourceType === "Option_Groups" && Array.isArray(res.data)) {
            setResourceTitle(res.data[0].title);
          } else {
            setResourceTitle(res.data.title);
          }
        } catch (error) {
          console.error(`Failed to fetch ${resourceType}:`, error);
        }
      };

      fetchResourceData();
    }
  }, [id]);

  const user = localStorage.getItem('user');
  const userObj = JSON.parse(user);

  return (
    <>
      {userObj?.role == "admin" && pathNameArrays.length > 0 && excludedPathNameArrays && (
        <div className="ml-[75px] mt-5">
          <Breadcrumb>
            <BreadcrumbList>
              {/* Home breadcrumb */}
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {/* Other path breadcrumbs */}
              {pathNameArrays.slice(0, -1).map((path, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbSeparator /> {/* Separator not inside <li> */}
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to={`/${pathNameArrays.slice(0, index + 1).join("/")}`}
                      >
                        {capitalizeFirstLetter(path)}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
              {/* Current page (last breadcrumb) */}
              <BreadcrumbSeparator /> {/* Separator not inside <li> */}
              <BreadcrumbItem>
                <BreadcrumbPage className="text-orange-400">
                  {id
                    ? resourceTitle
                    : capitalizeFirstLetter(
                        pathNameArrays[pathNameArrays.length - 1]
                      )}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
    </>
  );
};

export default BreadCrumbs;
