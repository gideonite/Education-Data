(defproject education-data "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [incanter "1.5.0"
                  :exclusions  [swank-clojure
                                org.clojure/clojure
                                org.clojure/clojure-contrib]]
                 [org.clojure/data.json "0.2.2" ]]
  :main education-data.core)
