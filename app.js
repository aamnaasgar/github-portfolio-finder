
var app = angular.module('githubApp', []);

// 1. GitHub API Service
app.factory('GitHubService', ['$http', function($http) {

    // GitHub API does not require a token
    // for public user profiles and public repositories.
    var baseUrl = 'https://api.github.com';

    return {

        // Get user profile
        getUserProfile: function(username) {

            return $http.get(
                baseUrl + '/users/' + encodeURIComponent(username)
            );
        },

        // Get user repositories
        getUserRepos: function(username) {

            return $http.get(
                baseUrl + '/users/' +
                encodeURIComponent(username) +
                '/repos',
                {
                    params: {
                        sort: 'updated',
                        per_page: 100
                    }
                }
            );
        }
    };
}]);


// 2. Custom Filter: Repository Size
app.filter('repoSize', function() {

    return function(sizeInKB) {

        if (!sizeInKB) {
            return '0 KB';
        }

        if (sizeInKB >= 1024) {
            return (sizeInKB / 1024).toFixed(1) + ' MB';
        }

        return sizeInKB + ' KB';
    };
});


// 3. Custom Filter: Programming Language
app.filter('languageCheck', function() {

    return function(lang) {

        return lang ? lang : 'Other';
    };
});


// 4. Application Controller
app.controller('AppController', [
    '$scope',
    'GitHubService',
    function($scope, GitHubService) {

        $scope.username = '';
        $scope.userProfile = null;
        $scope.userRepos = [];
        $scope.errorMessage = '';

        $scope.searchUser = function() {

            // Remove extra spaces
            var username = ($scope.username || '').trim();

            // Check empty username
            if (!username) {

                $scope.errorMessage =
                    'Please enter a GitHub username first.';

                $scope.userProfile = null;
                $scope.userRepos = [];

                return;
            }

            // Reset previous data
            $scope.username = username;
            $scope.errorMessage = '';
            $scope.userProfile = null;
            $scope.userRepos = [];

            // Get profile
            GitHubService.getUserProfile(username)

                .then(function(profileResponse) {

                    $scope.userProfile = profileResponse.data;

                    // Get repositories
                    return GitHubService.getUserRepos(username);

                })

                .then(function(reposResponse) {

                    $scope.userRepos = reposResponse.data;

                })

                .catch(function(error) {

                    console.error('GitHub API Error:', error);

                    $scope.userProfile = null;
                    $scope.userRepos = [];

                    if (error.status === 404) {

                        $scope.errorMessage =
                            'GitHub username not found. Please check the username.';

                    } else if (error.status === 403) {

                        $scope.errorMessage =
                            'GitHub API rate limit exceeded. Please try again later.';

                    } else if (error.status === 0) {

                        $scope.errorMessage =
                            'Network error. Check your internet connection.';

                    } else {

                        $scope.errorMessage =
                            'Error loading GitHub data. Status: ' +
                            error.status;
                    }
                });
        };
    }
]);


// 5. Custom Directive: User Portfolio
app.directive('userPortfolio', function() {

    return {

        restrict: 'E',

        scope: {
            profile: '=',
            repos: '='
        },

        template: `
            <div class="portfolio-container" ng-if="profile">

                <div class="profile-card">

                    <img
                        ng-src="{{profile.avatar_url}}"
                        alt="GitHub Profile"
                        class="avatar"
                    />

                    <h2>{{profile.name || profile.login}}</h2>

                    <p class="bio">
                        {{profile.bio || 'No bio available.'}}
                    </p>

                    <div class="stats">

                        <span>
                            📊
                            <strong>{{profile.public_repos}}</strong>
                            Repos
                        </span>

                        <span>
                            👥
                            <strong>{{profile.followers}}</strong>
                            Followers
                        </span>

                    </div>

                    <p>
                        <a
                            ng-href="{{profile.html_url}}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Visit GitHub Profile
                        </a>
                    </p>

                </div>

                <h3>Repositories</h3>

                <div class="repo-grid">

                    <div
                        class="repo-card"
                        ng-repeat="repo in repos | orderBy:'-stargazers_count'"
                    >

                        <h4>

                            <a
                                ng-href="{{repo.html_url}}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {{repo.name}}
                            </a>

                        </h4>

                        <p class="repo-desc">
                            {{repo.description || 'No description provided.'}}
                        </p>

                        <div class="repo-meta">

                            <span>
                                🛠️
                                {{repo.language | languageCheck}}
                            </span>

                            <span>
                                📦
                                {{repo.size | repoSize}}
                            </span>

                            <span>
                                ⭐
                                {{repo.stargazers_count}}
                            </span>

                        </div>

                    </div>

                </div>

            </div>
        `
    };
});
