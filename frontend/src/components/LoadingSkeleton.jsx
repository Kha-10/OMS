export const RecipeSkeleton = () => (
  <div
    role="status"
    className="max-w-[200px] max-h-[300px] bg-white shadow animate-pulse dark:border-gray-700"
  >
    <div className="w-[200px] h-[200px] flex items-center justify-center mb-4 bg-slate-200 rounded dark:bg-gray-700">
      <svg
        className="w-10 h-10 text-gray-200 dark:text-gray-600"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 16 20"
      >
        <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z" />
        <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z" />
      </svg>
    </div>
    <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-20 mb-4"></div>
    <div className="h-2 bg-slate-200 rounded-full dark:bg-gray-700 w-20 mb-2.5"></div>
    <div className="h-2 bg-slate-200 rounded-full dark:bg-gray-700 w-10 mb-2.5"></div>
  </div>
);

export const MenuSkeleton = () => (
  <div
    role="status"
    className="w-full h-fit p-4 bg-white space-y-4 divide-y divide-slate-200 rounded-lg animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700"
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
    <div className="flex items-center justify-between pt-4">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
    <div className="flex items-center justify-between pt-4">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
    <div className="flex items-center justify-between pt-4">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
    <div className="flex items-center justify-between pt-4">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
    <span className="sr-only">Loading...</span>
  </div>
);

export const CategorySkeleton = () => (
  <div
    role="status"
    className={`h-fit ${"w-[30%]"} p-4 bg-white space-y-4 divide-y divide-slate-200 rounded-lg animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
    <div className="flex items-center justify-between pt-4">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
    <div className="flex items-center justify-between pt-4">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
    <div className="flex items-center justify-between pt-4">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
    <div className="flex items-center justify-between pt-4">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
    <span className="sr-only">Loading...</span>
  </div>
);

export const AddandSearchSkeleton = () => (
  <div
    role="status"
    className="w-[100%] p-4 bg-white space-y-4 divide-y divide-slate-200 rounded-lg animate-pulse dark:divide-gray-700 md:px-6 py-3 dark:border-gray-700"
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
        <div className="w-32 h-2 bg-slate-200 rounded-full dark:bg-gray-700"></div>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full dark:bg-gray-700 w-12"></div>
    </div>
  </div>
);
