import { useParams } from "react-router-dom";

const CandidateDetailsPage = () => {
  const { id } = useParams();
  return (
    <div className="p-4">
      <h1>Candidate Details for ID: {id}</h1>
    </div>
  );
};
export default CandidateDetailsPage;
