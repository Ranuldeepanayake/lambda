The below role must be created in AWS IAM. This role will be assumed by the Github actions workflow.
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DeployLambda",
      "Effect": "Allow",
      "Action": [
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:UpdateFunctionCode"
      ],
      "Resource": "arn:aws:lambda:ap-south-1:104322896078:function:*"
    }
  ]
}

The below policy must be added to the above role. It allows the Github repository to assume the above role. The OIDC identity provider is AWS.
The OIDC provider is Github which requests an OIDC token from AWS.  
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GitHubActionsOIDC",
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::104322896078:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:Ranuldeepanayake/lambda:ref:refs/heads/*"
        }
      }
    }
  ]
}