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
;; some functions for munging data
;; ----------------------------------------------

(defn dbn->schoolcode [dbn-str]
  "dbn stands for District Borough Number.  A school code, it turns out, is
  just a bn, i.e. Borough Number. This function converts dbn to bn."

  ;; remove the district
  (string/replace dbn-str #"^\d\d" ""))

(defn not-blank? [value]
  (not (string/blank? (str value))))

(defn write-data-as-json [data path-to-file]
  "data is a seq of maps
  path-to-file is a string"
  (with-open [wrtr (io/writer path-to-file)]
    (.write wrtr
            (json/write-str data))))

(defn dirty-join [f & data-lists]
  "takes a predicate function `f` and some lists of data, and computes a 'dirty
  join' on them by grouping by the predicate and then dumping the resulting
  groups into a single map"
  (map
    #(into {} (second %))
    (group-by f (apply concat data-lists))))

;; ----------------------------------------------
;; constants
;; ----------------------------------------------

(def school-code (keyword "SCHOOL CODE"))
(def dbn (keyword "DBN"))

;; ----------------------------------------------
;; munge away
;; ----------------------------------------------

(defn school-reports-2010-11 []
  (let [school-reports (read-dataset "data/school_reports_2010_11.csv" :header true :delim \,)
        overall-score (keyword "2010-2011 OVERALL SCORE")
        cleaned-data (->>
                       (:rows school-reports)
                       (filter
                         ;; filter out records without overall-score.  Why don't they have
                         ;; overall-score?
                         #(not-blank? (% overall-score)))
                       (map
                         ;; map dbn->schoolcode
                         #(update-in % [dbn] dbn->schoolcode))
                       (map
                         ;; rename the column name dbn with SCHOOL CODE
                         #(clojure.set/rename-keys % {dbn school-code})))]
    (write-data-as-json cleaned-data "web/json/school_reports_2010_11.json")
    cleaned-data))

(defn pupil-teacher-ratio-2010-11 []
  (let [class-size (read-dataset
                     ;;"data/class_size_2010_11.mini.csv"   ;; for experimenting
                     "data/class_size_2010_11.csv"          ;; exec
                     :header true :delim \,)
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
    (read-dataset "data/math_test_results_2006_11.csv" :header true :delim \,)
    (:rows)
    (filter #(not-blank? (% (keyword "Mean Scale Score"))))
    (group-by dbn)
    (map (fn [group]
           [(first group) ;; dbn
            ;; compute a big mean across all grades and all years
            (mean (map (keyword "Mean Scale Score") (second group)))]))
    (map #(vector (dbn->schoolcode (first %)) (second %)))
    (map #(zipmap [school-code :math_test_score] %))))

(defn join-some-data []
  (write-data-as-json
    (dirty-join school-code
                (pupil-teacher-ratio-2010-11)
                (school-reports-2010-11)
                (math-test-2006-11))
    (str "web/json/"
         "pupil-teacher" "_"
         "school-report" "_"
         "math-test.json")))

;; fire away
;; (join-some-data)
