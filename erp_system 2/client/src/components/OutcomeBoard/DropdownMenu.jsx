import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';

const DropdownMenu = () => {
  const menuItems = [
    { name: 'Masters', href: '/dashboard/outcome-board/masters', current: true },
    { name: 'Mapping', href: '/dashboard/outcome-board/mapping', current: false },
    { name: 'Attainment', href: '/dashboard/outcome-board/attainment', current: false },
    { name: 'R-Path', href: '/dashboard/outcome-board/r-path', current: false },
  ];

  return (
    <Menu as="div" className="relative inline-block text-left w-full sm:w-auto">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          Outcome Board
          <svg className="-mr-1 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-full sm:w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {menuItems.map((item) => (
              <Menu.Item key={item.name}>
                {({ active }) => (
                  <Link
                    to={item.href}
                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-3 sm:px-4 py-2 text-xs sm:text-sm text-center sm:text-left`}
                  >
                    {item.name}
                  </Link>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default DropdownMenu;