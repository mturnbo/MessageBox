const Home = () => {
  return (
    <div>
      <h1 className="ext-2xl font-bold text-gray-900">Welcome to the Messaging App</h1>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
        consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
        laborum</p>


      <ul className="space-y-3">
        <li className="flex">
          <svg className="h-[1lh] w-5.5 shrink-0" viewBox="0 0 22 22" fill="none" stroke-linecap="square">
            <circle cx="11" cy="11" r="11" className="fill-blue-950"/>
            <circle cx="11" cy="11" r="10.5" className="stroke-sky-400/25"/>
            <path d="M8 11.5L10.5 14L14 8" className="stroke-sky-800 dark:stroke-sky-300"/>
          </svg>
          <p className="ml-3">
            View messages
            <code className="font-mono font-medium text-gray-950 dark:text-white">@theme</code>
          </p>
        </li>
        <li className="flex">
          <svg className="h-[1lh] w-5.5 shrink-0" viewBox="0 0 22 22" fill="none" stroke-linecap="square">
            <circle cx="11" cy="11" r="11" className="fill-blue-950"/>
            <circle cx="11" cy="11" r="10.5" className="stroke-sky-400/25"/>
            <path d="M8 11.5L10.5 14L14 8" className="stroke-sky-800 dark:stroke-sky-300"/>
          </svg>
          <p className="ml-3">
            Read messages
            <code className="font-mono font-medium text-gray-950 dark:text-white">@utility</code>
          </p>
        </li>
        <li className="flex">
          <svg className="h-[1lh] w-5.5 shrink-0" viewBox="0 0 22 22" fill="none" stroke-linecap="square">
            <circle cx="11" cy="11" r="11" className="fill-blue-950"/>
            <circle cx="11" cy="11" r="10.5" className="stroke-sky-400/25"/>
            <path d="M8 11.5L10.5 14L14 8" className="stroke-sky-800 dark:stroke-sky-300"/>
          </svg>
          <p className="ml-3">
            Send messages
            <code className="font-mono font-medium text-gray-950 dark:text-white">@variant</code>
          </p>
        </li>

      </ul>

    </div>
  );
}

export default Home;