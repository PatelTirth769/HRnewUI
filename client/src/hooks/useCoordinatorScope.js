import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useUserRole } from './useUserRole';

export function useCoordinatorScope() {
    const { isCoordinator } = useUserRole();
    const [coordinatorData, setCoordinatorData] = useState({
        boards: [],
        programs: [],
        loading: true,
    });

    useEffect(() => {
        if (!isCoordinator) {
            setCoordinatorData({ boards: [], programs: [], loading: false });
            return;
        }

        const fetchScope = async () => {
            try {
                const email = localStorage.getItem('user');
                if (!email) {
                    setCoordinatorData({ boards: [], programs: [], loading: false });
                    return;
                }

                const ref = collection(db, 'schooler_system/coordinators/data');
                const q = query(ref, where('email', '==', email));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    const data = snap.docs[0].data();
                    setCoordinatorData({
                        boards: data.boards || [],
                        programs: data.programs || [],
                        loading: false,
                    });
                } else {
                    setCoordinatorData({ boards: [], programs: [], loading: false });
                }
            } catch (error) {
                console.error("Error fetching coordinator scope:", error);
                setCoordinatorData({ boards: [], programs: [], loading: false });
            }
        };

        fetchScope();
    }, [isCoordinator]);

    return coordinatorData;
}
