
import { useState } from "react";
import { useForm } from "react-hook-form";
import Papa from "papaparse";
import "./App.css";

function App() {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState(false);
  const [error, setError] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null); // Store download URL
  const [csvData, setCsvData] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handlesubmit = async (data) => {
    setStart(true);
    setLoading(true);
    setError(false);
    setDownloadUrl(null);
     setCsvData(null);
     setResults(null); // Reset download URL before fetching

    const { rollStart, rollEnd, semester, instituteCode } = data;

    try {
      const response = await fetch(
        "https://resultextractor-gvbyamg4cch3a0f0.centralindia-01.azurewebsites.net/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rollStart, rollEnd, semester, instituteCode }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url); // Save the file URL
    } catch (error) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to download the file
  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "results.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
     
   const handleFileUpload = (event) => {
     const file = event.target.files[0];
     if (file) {
       setUploadedFile(file);

       Papa.parse(file, {
         header: true,
         complete: (results) => {
           setCsvData(results.data);
         },
       });
     }
   };


   const handleAnalyze = async () => {
     if (!csvData || !prompt) return;

     setAnalyzing(true);
      
      
     try {
       const response = await fetch("http://localhost:3000/analyze",{
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ data:csvData, prompt }),
       });

       if (!response.ok) {
         throw new Error("Analysis failed");
       }

       const data = await response.json();
       setResults(data);
     } catch (error) {
       console.error("Analysis error:", error);
     } finally {
       setAnalyzing(false);
     }
   };


 return (
 
   <div className="container">
     <h1 className="text-3xl font-bold text-center mb-6">
       🎓 RGPV Result Retrieval
     </h1>

     <form onSubmit={handleSubmit(handlesubmit)}>
       <label htmlFor="instituteCode">
         Institute Code with Admission Year:
       </label>
       <input
         type="text"
         name="instituteCode"
         placeholder="e.g., 0818IT22"
         required
         {...register("instituteCode")}
       />

       <label htmlFor="rollStart">Starting Roll Number:</label>
       <input
         type="number"
         name="rollStart"
         placeholder="e.g., 1001"
         required
         {...register("rollStart")}
       />

       <label htmlFor="rollEnd">Ending Roll Number:</label>
       <input
         type="number"
         name="rollEnd"
         placeholder="e.g., 1010"
         required
         {...register("rollEnd")}
       />

       <label htmlFor="semester">Semester:</label>
       <select name="semester" required {...register("semester")}>
         {[...Array(8)].map((_, i) => (
           <option key={i + 1} value={i + 1}>
             {i + 1}
           </option>
         ))}
       </select>

       <button type="submit" disabled={loading}>
         {loading ? "Fetching..." : "Start Retrieval"}
       </button>
     </form>

     <div id="progress">
       {loading ? (
         <div className="loading-screen">
           <div className="spinner"></div>
           <h2>Fetching is in progress...</h2>
         </div>
       ) : (
         <h2>
           {start
             ? error
               ? "Fetching failed!"
               : "Fetching completed!"
             : "Enter details to start"}
         </h2>
       )}

       <p id="statusMessage">
         {loading
           ? "Please wait, fetching is in progress..."
           : error
           ? "Something went wrong, try again."
           : "File generated successfully."}
       </p>

       {downloadUrl && (
         <button onClick={handleDownload} className="download-btn">
           Download CSV
         </button>
       )}
     </div>

     {/* CSV Analysis Section */}
     <div className="csv-analysis-section">
       <hr className="my-6" />
       <h2>📊 Analyze Results</h2>
       <input type="file" accept=".csv" onChange={handleFileUpload} />
       <textarea
         placeholder="Ask something like: 'Find top 5 performers' or 'Average marks in Subject X'"
         value={prompt}
         onChange={(e) => setPrompt(e.target.value)}
         rows={4}
       ></textarea>
       <button
         onClick={handleAnalyze}
         disabled={!csvData || !prompt || analyzing}
       >
         {analyzing ? "Analyzing..." : "Analyze CSV"}
       </button>
     </div>

     {results && (
       <div className="bg-blue-100 mt-24 p-4 rounded shadow">
         <h3 className="text-xl font-semibold text-gray-800 mb-4">
           🧠 Analysis Result:
         </h3>

         <div className="table-wrapper">
           <table>
             <thead>
               <tr>
                 {Object.keys(results[0]).map((header) => (
                   <th key={header}>{header}</th>
                 ))}
               </tr>
             </thead>
             <tbody>
               {results.map((row, idx) => (
                 <tr key={idx}>
                   {Object.values(row).map((value, i) => (
                     <td key={i}>{value}</td>
                   ))}
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>
     )}
   </div>
 );
}

 export default App;

