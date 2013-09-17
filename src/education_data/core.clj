(ns education-data.core
  (:require [incanter
             [core    :refer :all]
             [charts  :refer :all]
             [stats   :refer :all]
             [io      :refer :all]]
            [clojure.data.json :as json]
            [clojure.java.io :as io]
            [clojure.string :as string]))

;; ----------------------------------------------
;; constants
;; ----------------------------------------------

(def school-code (keyword "SCHOOL CODE"))
(def dbn (keyword "DBN"))

;; Some interesting questions
(def feel-welcome "My child's school makes me feel welcome.")
(def continue-education "Most of the teaching staff at my school expect me to continue my education after high school.")
(def feedback "School leaders give me regular and helpful feedback about my teaching.")

;; ----------------------------------------------
;; some functions for munging data
;; ----------------------------------------------

(defn dbn->schoolcode [dbn-str]
  "dbn stands for District Borough Number.  A school code, it turns out, is
  just a bn, i.e. Borough Number. This function converts dbn to bn."

  ;; remove the district
  (string/replace dbn-str #"^\d\d" ""))

(defn standardize [coll]
  "standardizing procedure for (all) datasets"
  (->> coll
    (map #(update-in % [dbn] dbn->schoolcode))           ;; map dbn->schoolcode
    (map #(clojure.set/rename-keys % {dbn school-code})) ;; rename the column name dbn with SCHOOL CODE
    ))

(defn not-blank? [value]
  (not (string/blank? (str value))))

(defn non-blank-column-names [colnames]
  (filter (comp not string/blank? name) colnames))

(defn write-data-as-json [data path-to-file]
  "data is a seq of maps
  path-to-file is a string"
  (with-open [wrtr (io/writer path-to-file)]
    (binding [*out* wrtr]
      (json/pprint data))))

(defn dirty-join [f & data-lists]
  "takes a predicate function `f` and some lists of data, and computes a 'dirty
  join' on them by grouping by the predicate and then dumping the resulting
  groups into a single map"
  (map
    #(into {} (second %))
    (group-by f (apply concat data-lists))))

(defn project-by [ks data]
  "projects data by school-code in addition to whatever keys, ks, are provided"
  (map #(select-keys % (concat [(keyword school-code)] ks)) data))

;; survey munging

(defn clean-survey-question [q]
  "cleans the survey question text"
  (keyword
    (string/replace (name q) #"^.+\.\s+" "")))

(defn clean-survey-questions [qs]
  "returns a map of old questions to new questions"
  (into {}
        (->> qs
          (non-blank-column-names)
          (map #(vector (keyword %) (clean-survey-question %))))))

(defn threshold [n]
  "converts numbers from an average value for a survey question into the
  textual value"
  (cond
    (=  n "N/A")        "Does Not Apply"
    (=  n "Not Scored") "Not Scored"    ; identity
    (=  n "")           "Not Scored"    ; TODO: what does `""` mean?
    (>= n 7.5)          "Strongly Agree"
    (>= n 5)            "Agree"
    (>= n 2.5)          "Disagree"
    (>= n 0)            "Strongly Disagree"))

(defn breakup-question-map [d]
  "takes a data record d from a survey and returns a seq of hashmaps with keys
  {:question :value :SCHOOL-CODE} which corresponds to making each question key
  the value of :question, taking the corresponding value a putting it as the
  value of :value and keeping the school-code.
  -----------------------------------------
  signature: hash-map -> (seq of hash-maps)
  "

  (let [questions
        (filter #(and
                   (not= school-code %)
                   (not= (keyword "School Type") %)
                   (not= (keyword "School Name") %))
                (keys d))]
    (map #(hash-map
            :question %
            :value (d %)
            school-code (d school-code))
         questions)))

(defn strip-question [d]
  (dissoc d :question))

(defn map-fn-over-groups [f grps]
  "maps the function `f` over the values of the map grps, for each key-value
  pair returning {k (map f value)} since value is assumed to be a collection,
  the result of a `group-by` operation
  "

  (->> grps
    (map #(vector (first %) (map f (second %))))
    (into {})))

(defn munge-survey-data [survey-dataset]
  (let [old-new-colnames (clean-survey-questions (:column-names survey-dataset))]
    (->> (:rows survey-dataset)
      (map #(clojure.set/rename-keys % old-new-colnames))
      (standardize)
      (map breakup-question-map)
      (flatten)
      (group-by :question)
      (map-fn-over-groups strip-question)
      (map-fn-over-groups #(update-in % [:value] threshold)))))

;; ----------------------------------------------
;; munge away
;; ----------------------------------------------

(defn my-read-dataset [path-to-file]
  "just because I'm tired of writing `:header true` over and over"
  (read-dataset path-to-file :header true :delim \,))

;; ----- not using -----

(defn school-reports-2010-11 []
  (let [school-reports (my-read-dataset "data/school_reports_2010_11.csv")
        overall-score (keyword "2010-2011 OVERALL SCORE")
        cleaned-data (->>
                       (:rows school-reports)
                       (filter
                         ;; filter out records without overall-score.  Why don't they have
                         ;; overall-score?
                         #(not-blank? (% overall-score)))
                       (standardize))]
    (write-data-as-json cleaned-data "web/json/school_reports_2010_11.json")
    cleaned-data))

(defn pupil-teacher-ratio-2010-11 []
  (let [class-size (my-read-dataset
                     ;;"data/class_size_2010_11.mini.csv"   ;; for experimenting
                     "data/class_size_2010_11.csv")         ;; exec
        pupil-teacher-ratio (keyword "SCHOOLWIDE PUPIL-TEACHER RATIO")
        cleaned-data (filter
                       ;; grab records with pupil-teacher-ratio
                       #(not-blank? (% pupil-teacher-ratio))
                       (:rows class-size))]
    (write-data-as-json cleaned-data "web/json/pupil_teacher_ratio_2010_11.json")
    cleaned-data))

(defn math-test-2006-11 []
  ;; N.B. only grades 3-8
  (->>
    (read-dataset "data/math_test_results_2006_11.csv")
    (:rows)
    (filter #(not-blank? (% (keyword "Mean Scale Score"))))
    (group-by dbn)
    (map (fn [group]
           [(first group) ;; dbn
            ;; compute a big mean across all grades and all years
            (mean (map (keyword "Mean Scale Score") (second group)))]))
    (map #(vector (dbn->schoolcode (first %)) (second %)))
    (map #(zipmap [school-code  ;; no longer dbn
                   :math_test_score] %))))

;; -----

(defn school-safety-reports []
  (->> (:rows (my-read-dataset "data/school_safety_reports.csv"))
    (standardize)))

(def parent-score
  (memoize
    (fn [] (->> (my-read-dataset "data/surveys/2013/parent_score.csv")
             (munge-survey-data)))))

(def student-score
  (memoize
    (fn [] (->> (my-read-dataset "data/surveys/2013/student_score.csv")
             (munge-survey-data)))))

(def teacher-score
  (memoize
    (fn [] (->> (my-read-dataset "data/surveys/2013/teacher_score.csv")
             (munge-survey-data)))))

(def organizational-data
  (memoize
    (fn []
      (->> (:rows (my-read-dataset "data/organizational_data/organizational_data.csv"))
        (map #(clojure.set/rename-keys % {(keyword "Location Code") dbn}))
        (standardize)
        (map #(select-keys % [(keyword "Zip")
                              (keyword "Fax Number")
                              (keyword "City")
                              school-code
                              (keyword "Open Date")
                              (keyword "Location Name")
                              (keyword "Primary Address")
                              (keyword "Principal Name")
                              (keyword "Principal Title")]))))))

;; main
(defn write-all-to-json []
  (for [data-path [[(organizational-data)   "web/json/organizational-data.json"]
                   [(parent-score)          "web/json/parent-score.json"]
                   [(student-score)         "web/json/student-score.json"]
                   [(teacher-score)         "web/json/teacher-score.json"]
                   [(organizational-data)   "web/json/organizational-data.json"]
                   [(school-safety-reports) "web/json/school-safety-reports.json"]
                   ]]
    (write-data-as-json
      (first data-path)
      (second data-path))))
