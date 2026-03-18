import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tab } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const OutcomeTabs = ({ filters }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sample data - in a real app, this would come from an API and be filtered based on the filters prop
  const categories = {
    Mission: [
      { id: 1, content: 'M1: To provide inclusive and quality education.' },
      { id: 2, content: 'M2: To develop ethically sound professionals.' },
      { id: 3, content: 'M3: To foster innovation and lifelong learning.' },
    ],
    Vision: [
      { id: 1, content: 'V1: To be a global leader in higher education.' },
      { id: 2, content: 'V2: To integrate innovation, research, and development.' },
    ],
    Advisory: [
      { id: 1, content: 'A1: Industry expert panel involvement.' },
      { id: 2, content: 'A2: Faculty and mentor advisory boards.' },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 rounded-lg shadow-md"
    >
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-700 p-1">
          {Object.keys(categories).map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'focus:outline-none',
                  selected
                    ? 'bg-blue-600 shadow text-white'
                    : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {Object.values(categories).map((posts, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                'rounded-xl bg-gray-800 p-3'
              )}
            >
              <div className="space-y-2">
                <h3 className="text-lg font-medium leading-6 text-white">
                  {Object.keys(categories)[idx]} Statement
                </h3>
                <ul className="space-y-2">
                  {posts.map((post) => (
                    <motion.li
                      key={post.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: post.id * 0.1 }}
                      className="relative rounded-md p-3 bg-gray-700"
                    >
                      <h3 className="text-sm font-medium leading-5 text-white">
                        {post.content}
                      </h3>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </motion.div>
  );
};

export default OutcomeTabs;