import OutcomeAccordion from './OutcomeAccordion';

export default function OutcomeDetails() {
  // PEO details
  const peoDetails = [
    {
      id: 'peo1',
      title: 'PEO 1',
      content: 'Excel in profession with sound knowledge in mathematics and applied sciences'
    },
    {
      id: 'peo2',
      title: 'PEO 2',
      content: 'Demonstrate leadership qualities and team spirit in achieving goals'
    },
    {
      id: 'peo3',
      title: 'PEO 3',
      content: 'Pursue higher studies to ace in research and develop as entrepreneurs.'
    }
  ];

  // PSO details
  const psoDetails = [
    {
      id: 'pso1',
      title: 'PSO 1',
      content: 'The students will be able to apply knowledge of modern tools in manufacturing enabling to conquer the challenges of Modern Industry.'
    },
    {
      id: 'pso2',
      title: 'PSO 2',
      content: 'The students will be able to design various thermal engineering systems by applying the principles of thermal sciences.'
    },
    {
      id: 'pso3',
      title: 'PSO 3',
      content: 'The students will be able to design different mechanisms and machine components of transmission of power and automation in modern industry.'
    }
  ];

  return (
    <div className="mt-6 bg-gray-800 p-4 rounded-md">
      <h3 className="text-white text-lg font-medium mb-4">Program Outcomes Details</h3>
      
      <div className="mb-6">
        <h4 className="text-gray-300 text-md font-medium mb-2">Program Educational Outcomes (PEOs)</h4>
        {peoDetails.map((peo) => (
          <OutcomeAccordion 
            key={peo.id}
            title={peo.title}
            content={peo.content}
          />
        ))}
      </div>
      
      <div>
        <h4 className="text-gray-300 text-md font-medium mb-2">Program Specific Outcomes (PSOs)</h4>
        {psoDetails.map((pso) => (
          <OutcomeAccordion 
            key={pso.id}
            title={pso.title}
            content={pso.content}
          />
        ))}
      </div>
    </div>
  );
}